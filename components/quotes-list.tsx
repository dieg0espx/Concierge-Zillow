'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Send,
  Eye,
  ExternalLink,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Plane,
  Download,
  Mail,
  Receipt,
} from 'lucide-react'
import { Quote, QuoteStatus, deleteQuote, sendQuote, duplicateQuote, emailQuotePDF, convertQuoteToInvoice } from '@/lib/actions/quotes'
import { formatCurrency } from '@/lib/utils'
import { generateQuotePDF } from '@/lib/pdf-generator'

const statusConfig: Record<QuoteStatus, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', icon: FileText },
  sent: { label: 'Sent', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Send },
  viewed: { label: 'Viewed', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: Eye },
  accepted: { label: 'Accepted', color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: AlertCircle },
}

export function QuotesList({ quotes }: { quotes: Quote[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [isEmailing, setIsEmailing] = useState(false)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const filteredQuotes = quotes.filter(quote =>
    quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.client_email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async () => {
    if (!selectedQuote) return
    setIsDeleting(true)

    const result = await deleteQuote(selectedQuote.id)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Quote deleted',
        description: `Quote ${selectedQuote.quote_number} has been deleted.`,
      })
      router.refresh()
    }

    setIsDeleting(false)
    setDeleteDialogOpen(false)
    setSelectedQuote(null)
  }

  const handleSend = async () => {
    if (!selectedQuote) return
    setIsSending(true)

    const result = await sendQuote(selectedQuote.id)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Quote sent',
        description: `Quote ${selectedQuote.quote_number} has been sent to ${selectedQuote.client_email}.`,
      })
      router.refresh()
    }

    setIsSending(false)
    setSendDialogOpen(false)
    setSelectedQuote(null)
  }

  const handleDownloadPDF = (quote: Quote) => {
    try {
      const pdf = generateQuotePDF(quote)
      pdf.save(`${quote.quote_number}.pdf`)
      toast({
        title: 'PDF Downloaded',
        description: `Quote ${quote.quote_number} has been downloaded.`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDuplicate = async (quote: Quote) => {
    setIsDuplicating(true)

    const result = await duplicateQuote(quote.id)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Quote duplicated',
        description: `Quote ${quote.quote_number} has been duplicated as a new draft.`,
      })
      router.refresh()
    }

    setIsDuplicating(false)
  }

  const handleEmailPDF = async () => {
    if (!selectedQuote) return
    setIsEmailing(true)

    const result = await emailQuotePDF(selectedQuote.id)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Email sent',
        description: `Quote PDF has been emailed to ${selectedQuote.client_email}.`,
      })
    }

    setIsEmailing(false)
    setEmailDialogOpen(false)
    setSelectedQuote(null)
  }

  const handleConvert = async () => {
    if (!selectedQuote) return
    setIsConverting(true)

    const result = await convertQuoteToInvoice(selectedQuote.id)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
      setIsConverting(false)
      setConvertDialogOpen(false)
      setSelectedQuote(null)
    } else {
      toast({
        title: 'Invoice created',
        description: `Quote ${selectedQuote.quote_number} has been converted to invoice.`,
      })
      setIsConverting(false)
      setConvertDialogOpen(false)
      setSelectedQuote(null)
      // Redirect to edit the new invoice
      router.push(`/admin/invoices/${result.data?.id}/edit`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Search quotes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
          />
        </div>
        <Link href="/admin/quotes/new">
          <Button className="btn-luxury">
            <Plus className="h-4 w-4 mr-2" />
            Create Quote
          </Button>
        </Link>
      </div>

      {/* Quote Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
        {(['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'] as QuoteStatus[]).map((status) => {
          const config = statusConfig[status]
          const count = quotes.filter(q => q.status === status).length
          const Icon = config.icon
          return (
            <Card key={status} className="glass-card-accent border-white/10">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-xs text-white/60 uppercase tracking-wider">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quotes Table - Desktop */}
      <Card className="glass-card-accent border-white/10 overflow-hidden hidden md:block">
        <CardContent className="p-0">
          {filteredQuotes.length === 0 ? (
            <div className="p-12 text-center">
              <Plane className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No quotes found</h3>
              <p className="text-white/60 mb-4">
                {searchTerm ? 'Try a different search term' : 'Create your first quote for luxury services'}
              </p>
              {!searchTerm && (
                <Link href="/admin/quotes/new">
                  <Button className="btn-luxury">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quote
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70">Quote #</TableHead>
                  <TableHead className="text-white/70">Client</TableHead>
                  <TableHead className="text-white/70 text-right">Total</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                  <TableHead className="text-white/70">Expires</TableHead>
                  <TableHead className="text-white/70 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => {
                  const config = statusConfig[quote.status]
                  const Icon = config.icon
                  const isExpired = quote.status === 'expired' ||
                    ((quote.status === 'sent' || quote.status === 'viewed') && new Date(quote.expiration_date) < new Date())

                  return (
                    <TableRow key={quote.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-mono text-white">
                        {quote.quote_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{quote.client_name}</p>
                          <p className="text-sm text-white/60">{quote.client_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-white">
                        {formatCurrency(quote.total)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${config.color} border`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className={isExpired ? 'text-red-400' : 'text-white/70'}>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(quote.expiration_date)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {quote.status === 'draft' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedQuote(quote)
                                  setSendDialogOpen(true)
                                }}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                title="Send Quote"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Link href={`/admin/quotes/${quote.id}/edit`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white/70 hover:text-white hover:bg-white/10"
                                  title="Edit Quote"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedQuote(quote)
                                  setDeleteDialogOpen(true)
                                }}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                title="Delete Quote"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {quote.status !== 'draft' && (
                            <>
                              {quote.status === 'accepted' && !quote.converted_to_invoice_id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedQuote(quote)
                                    setConvertDialogOpen(true)
                                  }}
                                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                  title="Convert to Invoice"
                                >
                                  <Receipt className="h-4 w-4" />
                                </Button>
                              )}
                              {quote.converted_to_invoice_id && (
                                <Link href={`/admin/invoices/${quote.converted_to_invoice_id}/edit`}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                    title="View Invoice"
                                  >
                                    <Receipt className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPDF(quote)}
                                className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedQuote(quote)
                                  setEmailDialogOpen(true)
                                }}
                                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                                title="Email PDF"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDuplicate(quote)}
                                disabled={isDuplicating}
                                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                                title="Duplicate Quote"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Link href={`/quote/${quote.quote_number}`} target="_blank">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white/70 hover:text-white hover:bg-white/10"
                                  title="View Quote"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </Link>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quotes Cards - Mobile */}
      {filteredQuotes.length === 0 ? (
        <Card className="glass-card-accent border-white/10 md:hidden">
          <CardContent className="p-12 text-center">
            <Plane className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No quotes found</h3>
            <p className="text-white/60 mb-4">
              {searchTerm ? 'Try a different search term' : 'Create your first quote for luxury services'}
            </p>
            {!searchTerm && (
              <Link href="/admin/quotes/new">
                <Button className="btn-luxury">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quote
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="md:hidden space-y-4">
          {filteredQuotes.map((quote) => {
            const config = statusConfig[quote.status]
            const Icon = config.icon
            const isExpired = quote.status === 'expired' ||
              ((quote.status === 'sent' || quote.status === 'viewed') && new Date(quote.expiration_date) < new Date())

            return (
              <Card key={quote.id} className="glass-card-accent border-white/10">
                <CardContent className="p-4 space-y-4">
                  {/* Header Row with Quote # and Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-mono text-sm text-white/70 mb-1">Quote #</p>
                      <p className="font-bold text-white">{quote.quote_number}</p>
                    </div>
                    <Badge className={`${config.color} border`}>
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>

                  {/* Client Info */}
                  <div>
                    <p className="text-sm text-white/70 mb-1">Client</p>
                    <p className="font-medium text-white">{quote.client_name}</p>
                    <p className="text-sm text-white/60">{quote.client_email}</p>
                  </div>

                  {/* Amount and Expiration Date */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div>
                      <p className="text-xs text-white/70 mb-1">Amount</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(quote.total)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/70 mb-1">Expires</p>
                      <div className={`flex items-center gap-1 text-sm ${isExpired ? 'text-red-400' : 'text-white/70'}`}>
                        <Clock className="h-3 w-3" />
                        {formatDate(quote.expiration_date)}
                      </div>
                    </div>
                  </div>

                  {/* Actions - Full width buttons with labels */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
                    {quote.status === 'draft' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedQuote(quote)
                            setSendDialogOpen(true)
                          }}
                          className="flex-1 text-blue-400 border-blue-400/30 hover:bg-blue-500/10"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                        <Link href={`/admin/quotes/${quote.id}/edit`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedQuote(quote)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {quote.status === 'accepted' && !quote.converted_to_invoice_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedQuote(quote)
                              setConvertDialogOpen(true)
                            }}
                            className="flex-1 text-emerald-400 border-emerald-400/30 hover:bg-emerald-500/10"
                          >
                            <Receipt className="h-4 w-4 mr-2" />
                            Convert
                          </Button>
                        )}
                        {quote.converted_to_invoice_id && (
                          <Link href={`/admin/invoices/${quote.converted_to_invoice_id}/edit`} className="flex-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-emerald-400 border-emerald-400/30 hover:bg-emerald-500/10"
                            >
                              <Receipt className="h-4 w-4 mr-2" />
                              View Invoice
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(quote)}
                          className="flex-1 text-green-400 border-green-400/30 hover:bg-green-500/10"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedQuote(quote)
                            setEmailDialogOpen(true)
                          }}
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(quote)}
                          disabled={isDuplicating}
                          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Link href={`/quote/${quote.quote_number}`} target="_blank">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/70 hover:text-white hover:bg-white/10"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card-accent border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Quote</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete quote {selectedQuote?.quote_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Confirmation Dialog */}
      <AlertDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <AlertDialogContent className="glass-card-accent border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Send Quote</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Send quote {selectedQuote?.quote_number} to {selectedQuote?.client_email}?
              The client will receive a link to view the quote and accept or decline it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSend}
              disabled={isSending}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isSending ? 'Sending...' : 'Send Quote'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email PDF Confirmation Dialog */}
      <AlertDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <AlertDialogContent className="glass-card-accent border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Email Quote PDF</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Email the PDF of quote {selectedQuote?.quote_number} to {selectedQuote?.client_email}?
              The client will receive the quote as a PDF attachment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmailPDF}
              disabled={isEmailing}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              {isEmailing ? 'Sending...' : 'Email PDF'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to Invoice Confirmation Dialog */}
      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent className="glass-card-accent border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Convert to Invoice</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Convert quote {selectedQuote?.quote_number} to an invoice?
              A new draft invoice will be created with all the quote details pre-filled.
              You'll be redirected to edit the invoice before sending.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvert}
              disabled={isConverting}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isConverting ? 'Converting...' : 'Convert to Invoice'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
